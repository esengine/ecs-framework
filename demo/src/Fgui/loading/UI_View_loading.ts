/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

module FUI.loading {

	export class UI_View_loading extends fairygui.GComponent {
		public m_title:fairygui.GTextField;
		public m_pg_loading:fairygui.GProgressBar;
		public static URL:string = "ui://mk2d64e7r5ro0";

		public static createInstance():UI_View_loading {
			return <UI_View_loading>(fairygui.UIPackage.createObject("loading", "View_loading"));
		}

		protected constructFromXML(xml:any):void {
			super.constructFromXML(xml);

			this.m_title = <fairygui.GTextField>(this.getChildAt(1));
			this.m_pg_loading = <fairygui.GProgressBar>(this.getChildAt(2));
		}
	}
}