/** This is an automatically generated class by FairyGUI. Please do not modify it. **/

module FUI.sc {

	export class UI_btn_sc extends fairygui.GButton {
		public m_name:fairygui.GTextField;
		public static URL:string = "ui://m4sln17ak7mf2";

		public static createInstance():UI_btn_sc {
			return <UI_btn_sc>(fairygui.UIPackage.createObject("sc", "btn_sc"));
		}

		protected constructFromXML(xml:any):void {
			super.constructFromXML(xml);

			this.m_name = <fairygui.GTextField>(this.getChildAt(3));
		}
	}
}